import React, { useEffect } from 'react';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import { red } from '@material-ui/core/colors';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles(() => ({
  code: {
    backgroundColor: red[50],
    color: red[500],
    border: `1px solid ${red[100]}`,
    borderRadius: 4,
    padding: '2px 4px',
  }
}))

export default function ExplorerHome() {
  const classes = useStyles();
  const [messages, actualSetMessages]: [any[], Function] = React.useState([]);

  const setMessages = (msgs: any[]) => {
    let reversed = msgs.reverse();
    actualSetMessages(reversed.slice(0, 5));
  }

  const listener = (_: any) => {
    setMessages(window.unigraph.backendMessages);
  }

  useEffect(() => {
    console.log(window.unigraph)
    window.unigraph.eventTarget.addEventListener("onmessage", listener);
    setMessages(window.unigraph.backendMessages);

    return function cleanup() {
      window.unigraph.eventTarget.removeEventListener("onmessage", listener);
    }
  }, [])

  return (
    <div>
      <Typography variant="h4">Connection status</Typography>
      <p>Connection readyState (connecting=0, open=1, closing=2, closed=3): {window.unigraph.backendConnection.readyState}</p>
      <p>Connected to: {window.unigraph.backendConnection.url}</p>
      <Typography variant="h4" gutterBottom>Messages</Typography>
      <Box display="grid" gridGap={8} justifyContent="start">
        {messages.map((message, i) => <code key={i} className={classes.code}>{JSON.stringify(message)}</code>)}
      </Box>
    </div>
  );
}
