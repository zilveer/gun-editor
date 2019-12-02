import React, { useState, useEffect } from "react";
import { hot } from "react-hot-loader/root";
import { GunEditor } from "./components/GunEditor";

const Gun = require("gun/gun");
require("gun/sea");

const App = () => {
  const [gun, setGun] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const hashUrlParams = new URLSearchParams(window.location.hash.substr(1));
  const priv = hashUrlParams.get("priv");
  const epriv = hashUrlParams.get("epriv");

  useEffect(() => {
    if (!id) {
      window.location = `https://gun-create.nmaro.now.sh?next=${encodeURIComponent(
        window.location.origin
      )}`;
    } else {
      const gun = Gun({
        peers: ["https://gunjs.herokuapp.com/gun"]
      });
      setGun(gun);
    }
  }, []);

  if (!gun || !id) {
    return <div>Loading...</div>;
  }

  return <GunEditor id={id} Gun={Gun} gun={gun} priv={priv} epriv={epriv} />;
};

export default hot(App);
