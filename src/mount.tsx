import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import PickRandomUserPlugin from './components/pick-random-user/component';

interface MountArgs {
  uuid: string;
  pluginName: string;
}

const mount = ({ uuid, pluginName }: MountArgs) => {
  const root = ReactDOM.createRoot(document.getElementById(uuid));
  root.render(
    <PickRandomUserPlugin {...{
      pluginUuid: uuid,
      pluginName,
    }}
    />,
  );
};

export default mount;
