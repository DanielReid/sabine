import { TextField } from "@material-ui/core";
import _ from "lodash";
import React from "react";
export default function StudentNames({
  names,
  changeCallback,
}: {
  names: string[];
  changeCallback: (prevName: string, newName: string) => void;
}) {
  function handleNameChanged(prevName: string, event: any) {
    changeCallback(prevName, event.target.value);
  }
  return (
    <div>
      {_.map(names, (name, idx) => (
        <TextField
          type="text"
          id={`${idx}-input`}
          key={`${idx}-input`}
          onChange={_.partial(handleNameChanged, name)}
          value={name}
        />
      ))}
    </div>
  );
}
