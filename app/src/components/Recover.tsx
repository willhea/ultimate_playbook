import { Component, type ReactNode } from 'react';
import { pageAddress } from '../model/share';
import { playbook } from '../plays';

/**
 * Last line of defence: if drawing the app ever throws, show a way out instead of a
 * blank page. The playbook doesn't touch anything saved in the browser, so it opens
 * even when a saved play is what's broken.
 */
export class Recover extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const open = (hash: string) => {
      window.location.replace(`${pageAddress()}${hash}`);
      window.location.reload();
    };
    return (
      <main className="recover">
        <h1>Something went wrong showing this play</h1>
        <p>Your saved plays are still in this browser.</p>
        <div className="button-row">
          <button type="button" className="btn btn-primary" onClick={() => open(`#playbook=${playbook()[0].slug}`)}>
            Open the playbook
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => open('')}>
            Try again
          </button>
        </div>
      </main>
    );
  }
}
