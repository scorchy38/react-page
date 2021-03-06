import {
  Avatar,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@material-ui/core';
import FormatSize from '@material-ui/icons/FormatSize';
import React from 'react';
import { usePluginOfCell } from '../../core/components/hooks';
import Tools from './Tools';

type Props = {
  nodeId: string;
  toggleSize: () => void;
};
const Content: React.FC<Props> = ({ nodeId, toggleSize }) => {
  const { title, icon } = usePluginOfCell(nodeId) ?? {};

  return (
    <>
      <Grid container={true} direction="row" alignItems="center">
        {icon || title ? (
          <Grid item={true}>
            <Avatar
              children={icon || (title ? title[0] : '')}
              style={{
                marginRight: 16,
              }}
            />
          </Grid>
        ) : null}
        <Grid item={true}>
          <Typography variant="subtitle1">{title}</Typography>
        </Grid>
        <Grid item={true}>
          <Tooltip title="Toggle Size">
            <IconButton
              onClick={toggleSize}
              aria-label="toggle Size"
              color="primary"
            >
              <FormatSize />
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item={true} style={{ marginLeft: 'auto' }}>
          <Tools nodeId={nodeId} />
        </Grid>
      </Grid>
    </>
  );
};

export default React.memo(Content);
