import React from "react";

export function SplashScreen () {
    return <div>
        <div style={{position: "absolute", left: "50%", top: "50%"}}> Loading... </div>
    </div>
}

export function DisconnectedSplashScreen () {
    return <div>
        <div style={{position: "absolute", left: "50%", top: "50%"}}> Disconnected, refresh to try again. </div>
    </div>
}