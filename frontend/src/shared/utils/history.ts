import { createBrowserHistory } from 'history';
import { attachRumToHistory } from '../../datadog';

const history = createBrowserHistory();

attachRumToHistory(history);

export default history;
