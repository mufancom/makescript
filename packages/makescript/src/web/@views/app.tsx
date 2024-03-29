import {Route} from 'boring-router-react';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';

import {route} from '../@routes';

import {HomeView} from './@home';
import {InitializeView} from './@initialize';
import {LoginView} from './@login';
import {MakeflowLoginView, MakeflowView} from './@makeflow';
import {RunningRecordsView, ScriptsManagementView} from './@scripts';
import {StatusView} from './@status';
import {TokensView} from './@tokens';

const Wrapper = styled.div`
  background-color: hsl(221, 55%, 97%);
`;

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <Wrapper>
        <Route match={route.initialize} component={InitializeView} />
        <Route match={route.login} component={LoginView} />
        <Route exact match={route} component={HomeView} />
        <Route match={route.scripts.records} component={RunningRecordsView} />
        <Route
          match={route.scripts.management}
          component={ScriptsManagementView}
        />
        <Route match={route.tokens} component={TokensView} />
        <Route match={route.status} component={StatusView} />
        <Route exact match={route.makeflow} component={MakeflowView} />
        <Route match={route.makeflow.login} component={MakeflowLoginView} />
      </Wrapper>
    );
  }
}
