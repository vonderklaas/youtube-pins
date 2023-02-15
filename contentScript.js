(() => {
  let youtubeLeftControls, youtubePlayer;
  let currentVideo = '';
  let currentVideoBookmarks = [];

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  const addNewBookmarkEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const newBookmark = {
      time: currentTime,
      desc: 'Bookmark at ' + getTime(currentTime),
    };

    currentVideoBookmarks = await fetchBookmarks();

    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(
        [...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)
      ),
    });
  };

  const newVideoLoaded = async () => {
    const bookmarkBtnExists =
      document.getElementsByClassName('bookmark-btn')[0];

    currentVideoBookmarks = await fetchBookmarks();

    if (!bookmarkBtnExists) {
      // Create custom bookmark button
      const bookmarkBtn = document.createElement('img');
      bookmarkBtn.src = chrome.runtime.getURL('assets/bookmark.png');
      bookmarkBtn.className = 'ytp-button ' + 'bookmark-btn';
      bookmarkBtn.title = 'Click to bookmark current timestamp';
      bookmarkBtn.style.width = '25px';
      bookmarkBtn.style.height = '25px';
      bookmarkBtn.style.marginTop = '12px';
      bookmarkBtn.style.marginLeft = '5px';

      youtubeLeftControls =
        document.getElementsByClassName('ytp-left-controls')[0];
      youtubePlayer = document.getElementsByClassName('video-stream')[0];

      youtubeLeftControls.appendChild(bookmarkBtn);
      bookmarkBtn.addEventListener('click', addNewBookmarkEventHandler);
    }
  };

  chrome.runtime.onMessage.addListener((obj, _sender, response) => {
    const { type, value, videoId } = obj;

    if (type === 'NEW') {
      currentVideo = videoId;
      newVideoLoaded();
    } else if (type === 'PLAY') {
      youtubePlayer.currentTime = value;
    } else if (type === 'DELETE') {
      currentVideoBookmarks = currentVideoBookmarks.filter(
        (b) => b.time != value
      );
      chrome.storage.sync.set({
        [currentVideo]: JSON.stringify(currentVideoBookmarks),
      });

      response(currentVideoBookmarks);
    }
  });

  newVideoLoaded();

  const getTime = (time) => {
    const date = new Date(0);
    date.setSeconds(time);
    return date.toISOString().substr(11, 8);
  };
})();
