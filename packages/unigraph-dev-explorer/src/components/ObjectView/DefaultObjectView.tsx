import React, { FC } from 'react';
import { ObjectViewOptions } from './types';

type DefaultObjectViewProps = {
    object: any,
    options: ObjectViewOptions,
};

const DefaultObjectView: FC<DefaultObjectViewProps> = ({ object, options }) => {
    return <div>
        {JSON.stringify(object, null, 2)}
    </div>;
}

export default DefaultObjectView;