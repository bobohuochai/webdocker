// eslint-disable-next-line import/no-unresolved
import React from 'react';
import './button.scss';

export interface ButtonProps {
  label:string
}

const Button = (props:ButtonProps) => (<button>{props.label}</button>);

export default Button;
