import { Button, FormControlLabel, Switch, Typography } from '@material-ui/core';
import React from 'react';
import { useEffectOnce } from 'react-use';

type length = string;

const schedules: Record<string, length[]> = {
    default: ['work', 'break'],
    spaced: ['work', 'break', 'work', 'break', 'work', 'break', 'work', 'longbreak'],
};

const lengths: Record<length, number> = {
    work: 25 * 60,
    break: 5 * 60,
    longbreak: 15 * 60,
};

const scheduleData: Record<length, any> = {
    work: {
        name: 'Work',
        color: 'azure',
    },
    break: {
        name: 'Break',
        color: 'lightgreen',
    },
    longbreak: {
        name: 'Long break',
    },
};

const moveFocusToInbox = async () => {
    // TODO: move focus to inbox
    const { items, listUid, contextUid } = window.unigraph.getState('calendar/focusItems').value;
    await window.unigraph.deleteItemFromArray(listUid, items, contextUid);
    window.unigraph.runExecutable('$/executable/add-item-to-list', {
        where: '$/entity/inbox',
        item: items,
    });
};

export function WidgetPomodoro() {
    const [currSchedules, setCurrSchedules] = React.useState('default');
    const [currSchedulePos, setCurrSchedulePos] = React.useState(0);
    const [timerActive, setTimerActive] = React.useState(false);
    const [timeLeft, setTimeLeft] = React.useState(lengths[schedules[currSchedules][currSchedulePos]]);
    const [moveToInbox, setMoveToInbox] = React.useState(false);
    const [_rs0, _rs1] = React.useState(false);
    const reset = () => _rs1(!_rs0);
    const next = (pos: any, sched: any) =>
        schedules[sched].length - 1 === pos ? setCurrSchedulePos(0) : setCurrSchedulePos(pos + 1);

    const stateRef = React.useRef({
        currSchedulePos,
        currSchedules,
        timerActive,
        timeLeft,
        moveToInbox,
    });
    React.useEffect(() => {
        stateRef.current = {
            currSchedulePos,
            currSchedules,
            timerActive,
            timeLeft,
            moveToInbox,
        };
    });

    useEffectOnce(() => {
        const onTick = setInterval(() => {
            const {
                // eslint-disable-next-line no-shadow
                currSchedulePos,
                // eslint-disable-next-line no-shadow
                currSchedules,
                // eslint-disable-next-line no-shadow
                timerActive,
                // eslint-disable-next-line no-shadow
                timeLeft,
                // eslint-disable-next-line no-shadow
                moveToInbox,
            } = stateRef.current;
            if (timeLeft > 0 && timerActive) {
                setTimeLeft(timeLeft - 1);
            } else if (timerActive) {
                next(currSchedulePos, currSchedules);
                window.unigraph.addNotification({
                    from: 'Pomodoro',
                    name: 'Pomodoro complete!',
                    content: 'Pomodoro complete!',
                });
                if (moveToInbox && schedules[currSchedules][currSchedulePos] === 'work') moveFocusToInbox();
            }
        }, 1000);
        return function cleanup() {
            clearInterval(onTick);
        };
    });

    React.useEffect(() => {
        setTimeLeft(lengths[schedules[currSchedules][currSchedulePos]]);
    }, [currSchedules, currSchedulePos, _rs0]);

    React.useEffect(() => {
        if (!timerActive && el.current) (el as any).current.parentElement.style.backgroundColor = '';
        else if (el.current) {
            const newColor = scheduleData[schedules[currSchedules][currSchedulePos]].color;
            (el as any).current.parentElement.style.backgroundColor = newColor;
        }
    });

    const el = React.useRef(null);

    return (
        <div style={{ height: '120px' }} ref={el}>
            <Typography variant="body1">
                Current schedule:
                {scheduleData[schedules[currSchedules][currSchedulePos]].name}
            </Typography>
            <Typography variant="h2">
                {Math.floor(timeLeft / 60)} : {timeLeft % 60}
            </Typography>
            <div>
                <Button onClick={() => setTimerActive(!timerActive)}>{timerActive ? 'Stop' : 'Start'}</Button>
                <Button onClick={reset}>Reset</Button>
                <Button onClick={() => next(currSchedulePos, currSchedules)}>Next</Button>
            </div>
            <FormControlLabel
                control={
                    <Switch checked={moveToInbox} onChange={() => setMoveToInbox(!moveToInbox)} name="moveToInbox" />
                }
                label={'Move Focus to Inbox after "Work" timer complete'}
            />
        </div>
    );
}
