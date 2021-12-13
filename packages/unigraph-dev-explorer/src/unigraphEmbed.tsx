/**
 * Helper functions for using Unigraph as an embedded component in another app.
 */

import React from 'react';
import ReactDOM from 'react-dom';

export const mountComponentWithUid = (uid: string, elementId: string) => {
    ReactDOM.render(<React.StrictMode>
        {uid}
    </React.StrictMode>, document.getElementById(elementId))
}

export const initUnigraphEmbed = () => {

}