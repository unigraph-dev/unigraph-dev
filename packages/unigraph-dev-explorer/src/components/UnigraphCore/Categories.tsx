import { Grid, Typography } from '@material-ui/core';
import { TagListSubscription } from '../../examples/semantic/TagWidget';
import { ListsList } from './ListsList';

export function Categories() {
    return (
        <Grid container>
            <Grid item style={{ padding: '16px' }} xs={12} md={6} lg={4}>
                <Typography>Tags (drag to items)</Typography>
                <TagListSubscription />
            </Grid>
            <Grid item style={{ padding: '16px' }} xs={12} md={6} lg={4}>
                <Typography>Lists (drag items here)</Typography>
                <ListsList />
            </Grid>
        </Grid>
    );
}
