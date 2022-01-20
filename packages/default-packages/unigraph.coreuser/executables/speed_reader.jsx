const { uid, object } = params;

const [text, setText] = React.useState(['']);
React.useMemo(() => {
    const html = object?.['_value.%'];
    const span = document.createElement('span');
    span.innerHTML = html;
    setText(span.textContent.split(/\s+/));
}, [object]);

// Speed reader
const [speed, setSpeed] = React.useState(400); // In wpm
const [timer, setTimer] = React.useState();
const [index, setIndex] = React.useState(0);
const [ttsOn, setTTSOn] = React.useState(false);
const indexRef = React.useRef(index);

const start = () => {
    setTimer(
        setInterval(() => {
            indexRef.current++;
            setIndex(indexRef.current);
        }, 60000 / speed),
    );
};

React.useEffect(() => {
    if (ttsOn) {
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text[index]);
        ut.rate = 10;
        window.speechSynthesis.speak(ut);
    }
}, [index]);

const stop = () => {
    clearInterval(timer);
};

const reset = () => {
    indexRef.current = 0;
    setIndex(indexRef.current);
};

return (
    <div>
        <div>Speed: {speed.toString()} wpm</div>
        <button onClick={start}>Start</button>
        <button onClick={stop}>Stop</button>
        <button onClick={reset}>Reset</button>
        <input
            type="checkbox"
            checked={ttsOn}
            onChange={() => {
                setTTSOn(!ttsOn);
            }}
        />
        <h1>{text[index] || 'The end'}</h1>
    </div>
);
