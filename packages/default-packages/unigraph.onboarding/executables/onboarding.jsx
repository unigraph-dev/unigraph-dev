return <div>
    <Typography>This is the Home screen - a place for all your apps and things to do. 
        When new items that need your attention appear, it will automatically show up as a card here.
    </Typography>
    <Typography variant="h5">Omnibar (Ctrl/Cmd + E)</Typography>
    <Typography>Use the Omnibar to jump to views, create new objects, execute commands, and search Unigraph.</Typography>
    <Typography variant="h5">Connect with 3rd-party apps</Typography>
    <Typography>To connect with your apps, go to Settings (in the left sidebar) and connect to your accounts.</Typography>
    <Typography>Note: if you are building this from source, you need developer tokens for them and you can go to their respective
        developer pages to obtain them. It's relatively easy and most requests will be approved right away. 
    </Typography>
    <Typography>Current progress with apps: </Typography>
    <ul>
        <li>Gmail/Google Calendar: 1-way sync works fine. Changes in Unigraph will not be synced to Google</li>
        <li>Reddit: everything works fine!</li>
        <li>Twitter: everything works fine! Currently working on supporting multiple twitter lists and filters. For now, you'll need to create a 
            twitter list nameed 'Subscription' (exactly) and add any accounts you want to sync to unigraph there.
        </li>
    </ul>
    <button onClick={() => {
        window.unigraph.deleteObject('$/entity/section_onboarding')
    }}>Never show again</button>

</div>