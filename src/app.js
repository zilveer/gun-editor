import React, { useRef } from "react";
import { hot } from "react-hot-loader/root";
import { GunEditor } from "./components/GunEditor";

require("gun/lib/open");

const App = () => {
  const newId = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("document");

  if (!id) {
    return (
      <div className="new-document">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (newId.current.value) {
              window.location.href = `${window.location.origin}?document=${newId.current.value}`;
            }
          }}
        >
          <input ref={newId} placeholder="(New) document ID e.g. helloworld" />
        </form>
      </div>
    );
  }

  return <GunEditor id={id} />;
};

export default hot(App);
