# Planmill timereport CLI

#### Prerequisites
Install [node.js](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/)

#### Installation

1.  Clone the repo
2.  Run: `$ yarn install`
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
5.  Run `yarn start` and enjoy!
