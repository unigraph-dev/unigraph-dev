
  - Creating the project
    - Go to [https://console.cloud.google.com/](https://console.cloud.google.com/) and select "Create project" on the left or in the "Select a project" dropdown bar.
    - Enter the project name and choose a location (the default "no organization" would work, it doesn't matter);
    - Click "Create".
  - Now, you'll be at the "Dashboard" page.
    - ![](https://i.imgur.com/WxnzYYL.png)
    - At the dropdown menu, select "APIs & Services", then click "Enabled APIs & services":
      - Click "Enable APIs and services" near the top, and 
        - search for "Gmail API", and click "Enable".
        - search for "Google Calendar API", and click "Enable".
    - Now, at the same dropdown menu, select "APIs & Services", then "OAuth consent screen".
      - Click "configure OAuth consent screen".
      - Select "External" for the user type, then fill in the App information - you only need to fill in the required fields.
      - In "Scopes", select "Add or remove scopes", then search for "Gmail API", and select the scope with the URL `https://mail.google.com` (the broadest scope). Then, search for "Calendar API" and select the scope with the URL `.../auth/calendar`. Then, click "Update" near the end.
        - Your final scopes should look like this: ![](https://i.imgur.com/8IA4wZq.png)
      - In "Test users", click "Add users" and add your own email and click "Save" (you might have to click twice).
    - Finally, at the same dropdown menu, select "APIs & Services", then "Credentials".
      - Click "Create credentials" near the top, then "OAuth client ID".
      - Select "Desktop app" as the application type, enter a name (anything would do), and click "Create".
      - You should now have a client ID and secret - don't close this dialogue, we'll use this to configure Unigraph.
  - Now, create a file called `secrets.env.json` at the project root, and put your api keys in as such:
    -     {
            "google": {
                "client_id": "....apps.googleusercontent.com",
                "client_secret": "GOCSPX-..."
            }
            <other API keys>
        }
    - Make sure the final JSON is valid (i.e. with the correct amount of commas, etc)
  - All done! When you start the backend now, you'll be add a twitter account, etc as normal. If you want to add other services, go add those API keys first.