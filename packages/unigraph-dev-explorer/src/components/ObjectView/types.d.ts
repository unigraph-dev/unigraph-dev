type ObjectViewOptions = {
    viewer?: 'string' | 'json-tree' | 'dynamic-view' | 'code-editor' | 'dynamic-view-detailed';
    unpad?: boolean;
    canEdit?: boolean;
    showContextMenu?: boolean;
    viewId?: any;
};

type DefaultObjectViewProps = {
    object: any;
    options: ObjectViewOptions;
    callbacks?: Record<string, any>;
};
