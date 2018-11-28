# Planmill timereport CLI

#### Prerequisites
Install [node.js](https://nodejs.org/en/)

#### Installation

1.  Clone the repo
2.  Run: `$ npm install`
3.  Create API keys for your planmill by visiting `https://online.planmill.com/{instance}/api/registrations.jsp`. Give it a _Client ID_ and use `http://localhost` as _alowed redirect URIs_
4.  Create config file `config.json` and fill in the missing information:

    ```json
    {
        "apiEndpoint": "https://online.planmill.com/{instance}/api/1.5",
        "tokenUrl": "https://online.planmill.com/{instance}/api/oauth2/token",
        "user": "{Client ID}",
        "pass": "{Client Secret}"
    }
    ```
    You can place the config.json wherever you like and point to it using `--config` flag. Default search locations include _current directory_ and _`~/.config/planmill/`_
5.  Run `npm start` and enjoy!

6.  Make a symlink to a script that runs this app to your `/usr/local/bin` or similar to make this CLI available everywhere
    e.g.
    
    ```bash
    #!/bin/bash
    
    node /var/www/planmill-fetch/index.js  
    ```
