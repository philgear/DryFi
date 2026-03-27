mergeInto(LibraryManager.library, {
  // Call this from C# to notify Angular that the scene is loaded
  NotifyUnityLoaded: function () {
    if (window.onUnityLoaded) {
      window.onUnityLoaded();
    }
  },

  // Call this from C# when a user clicks a POI
  NotifyPoiClicked: function (poiIdStr) {
    var poiId = UTF8ToString(poiIdStr);
    if (window.onUnityPoiClicked) {
      window.onUnityPoiClicked(poiId);
    }
  }
});
