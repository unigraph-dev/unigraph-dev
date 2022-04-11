
  - First, go to [https://developer.twitter.com/](https://developer.twitter.com/) and click "Sign up".
  - Then, fill out the form (if you aren't a developer yet) to get "Essential access".
    - You'll need to verify your phone number and email for registration.
    - You don't have to enter your real name.
    - After you verify your email, you should automatically gain essential access.
  - Now, enter a name for your App and you'll have the API keys, secret, and bearer token.
    - ![start.png](https://i.imgur.com/3OTEgDa.png)
    - ![2.png](https://i.imgur.com/YsFWWPC.png)
    - **Note**: Save these keys now since we'll need them for later.
  - Click "Skip to dashboard" and then, click the gear icon in your new app.
    - ![](https://i.imgur.com/c3gbw7J.png)
    - Now, click on "set up" to set up oauth access.
    - ![](https://i.imgur.com/VQ5Heuu.png)
    - Select OAuth 1.0a here
    - ![](https://i.imgur.com/G0sudiI.png)
    - Leave everything else as default and feel out the callback URI and Website URL.
    - ![](https://i.imgur.com/L1gKgXX.png)
  - Now, create a file called `secrets.env.json` at the project root, and put your api keys in as such:
    - ```
    {
        "twitter": {
            "api_key": "QsgR...",
            "api_secret_key": "VH4J6...",
            "bearer_token": "AAAAAAAAAAAAAAAAAAAAA..."
        }
        <other API keys>
    }
    ```
    - Make sure the final JSON is valid (i.e. with the correct amount of commas, etc)
  - All done! When you start the backend now, you'll be add a twitter account, etc as normal. If you want to add other services, go add those API keys first.