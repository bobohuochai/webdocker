/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import Application from './Application';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'ReactComponentLibrary/Application',
  component: Application,
} as ComponentMeta<typeof Application>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Application> = (args) => <Application {...args} />;

export const LightYearAppliction = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
LightYearAppliction.args = {
  name: 'LightyearMicroApp',
  manifest: {
    scripts: ['https://dev-cdn17.pingpongx.com/lightyear_file/22.8.4.4.1/my-lib.umd.js'],
    styles: ['https://dev-cdn17.pingpongx.com/lightyear_file/22.8.4.4.1/my-lib.css'],
  },
  initialPath: '/lightyear/collection/advanceCollectionhome',
  config: { sandbox: { iframe: true }, dynamicPatch: true },
};
