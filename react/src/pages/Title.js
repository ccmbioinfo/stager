import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';

export default function Title(props) {
  return (
    <Typography variant="button" display="block" gutterBottom color="primary" padding="1rem">
      {props.children}
    </Typography>
  );
}

Title.propTypes = {
  children: PropTypes.node,
};
