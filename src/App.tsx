import {
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@material-ui/core";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { names, uniqueNamesGenerator } from "unique-names-generator";
import "./App.css";
import StudentNames from "./StudentNames";

type Student = {
  id: number;
  name: string;
};

type SendEvent = {
  from: Student;
  to: Student;
};

const N_STUDENTS = 7;
const N_WEEKS = 6;
const MAX_TRIES = 2000;

function renderSequences(sequences: SendEvent[][], nWeeks: number) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          {_.map(_.range(1, nWeeks + 1), (n) => (
            <th>{`Week ${n}`}</th>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {_.map(sequences, (sequence, idx) => (
          <TableRow key={"seq" + idx}>{renderSequence(sequence)}</TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function renderSequence(sequence: SendEvent[]) {
  return _.map(sequence, (sendEvent: SendEvent) => (
    <TableCell key={sendEvent?.from?.id + "→" + sendEvent?.to?.id}>
      {`${sendEvent?.from?.name}→${sendEvent?.to?.name}`}
    </TableCell>
  ));
}
function genSequences(students: Student[], weeks: number[]): SendEvent[][] {
  let previousAssignments = _(students)
    .map((student) => [student.id, {}])
    .fromPairs()
    .value();
  return _.map(students, (student: Student): SendEvent[] => {
    const others = _.reject(students, ["id", student.id]);
    const { chain, updated } = buildChain(
      student,
      _.sampleSize(others, others.length),
      previousAssignments,
      weeks
    );
    previousAssignments = updated;
    return chain;
  });
}

type ChainResponse = {
  chain: SendEvent[];
  updated: Record<number, Record<number, boolean>>;
};

function buildChain(
  start: Student,
  todos: Student[],
  previousAssignments: Record<number, Record<number, boolean>>,
  weeks: number[]
): ChainResponse {
  if (!todos.length || !weeks.length) {
    return {
      chain: [],
      updated: previousAssignments,
    };
  } else {
    const to = _.find(todos, (todo) => !previousAssignments[start.id][todo.id]);
    if (!to) {
      console.log("impossible");
      return {
        chain: [],
        updated: previousAssignments,
      };
    } else {
      const { chain, updated } = buildChain(
        to,
        _.reject(todos, ["id", to.id]),
        {
          ...previousAssignments,
          [start.id]: {
            ...previousAssignments[start.id],
            [to.id]: true,
          },
        },
        _.tail(weeks)
      );
      return { chain: [{ from: start, to: to }, ...chain], updated: updated };
    }
  }
}

function App() {
  const [nStudents, setNStudents] = useState(N_STUDENTS);
  const [students, setStudents] = useState<Student[]>();
  const [sequences, setSequences] = useState<SendEvent[][]>();
  const [nWeeks, setNWeeks] = useState(N_WEEKS);
  const [studentNames, setStudentNames] = useState<string[]>();

  function handleNStudentsChanged(event: any) {
    if (
      event?.target?.value &&
      Number.parseInt(event.target.value) !== nStudents
    ) {
      setNStudents(Number.parseInt(event.target.value));
    }
  }
  function handleNWeeksChanged(event: any) {
    if (
      event?.target?.value &&
      Number.parseInt(event.target.value) !== nWeeks
    ) {
      setNWeeks(Number.parseInt(event.target.value));
    }
  }

  function handleRegenclick() {
    if (students) {
      setSequences(genSequences(students, _.range(1, nWeeks + 1)));
    }
  }

  function handleNameChange(prevName: string, newName: string) {
    if (studentNames) {
      const idx = studentNames.indexOf(prevName);
      setStudentNames(Object.assign([], studentNames, { [idx]: newName }));
    }
  }

  function handleSearchClick() {
    if (students) {
      let n = 0;
      let bestNMissing = nWeeks * nStudents + 1;
      let bestChains;
      while (n < MAX_TRIES && bestNMissing > 0) {
        const sequences = genSequences(students, _.range(1, nWeeks + 1));
        const nMissing = getNMissing(sequences);
        if (nMissing < bestNMissing) {
          bestNMissing = nMissing;
          bestChains = sequences;
        }
        ++n;
      }
      console.log(n);
      setSequences(bestChains);
    }
  }

  function getNMissing(sequences: SendEvent[][]) {
    const sequenceLengths = _.map(
      sequences,
      (sequence) => nWeeks - sequence.length
    );
    return _.sum(sequenceLengths);
  }

  useEffect(() => {
    if (studentNames?.length) {
      const students = _.map(_.range(1, nStudents + 1), (n) => {
        return {
          id: n,
          name: studentNames[n - 1],
        };
      });
      setStudents(students);
    }
  }, [nStudents, studentNames]);

  useEffect(() => {
    setStudentNames(
      _.map(_.range(1, nStudents + 1), () =>
        uniqueNamesGenerator({ dictionaries: [names] })
      )
    );
  }, [nStudents]);
  useEffect(() => {
    if (students) {
      setSequences(genSequences(students, _.range(1, nWeeks + 1)));
    }
  }, [nWeeks, students]);

  return sequences ? (
    <div className="App">
      <div>
        <TextField
          type="number"
          label="Aantal studenten"
          id="n-students"
          inputProps={{ min: "0", max: "10", step: "1" }}
          onChange={handleNStudentsChanged}
          defaultValue={N_STUDENTS}
        />
        <TextField
          type="number"
          label="Aantal weken"
          id="n-weeks"
          inputProps={{ min: "0", max: "10", step: "1" }}
          onChange={handleNWeeksChanged}
          defaultValue={N_WEEKS}
        />
      </div>
      {studentNames ? (
        <StudentNames names={studentNames} changeCallback={handleNameChange} />
      ) : (
        <></>
      )}
      <div>
        <ButtonGroup>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRegenclick}
          >
            Opnieuw
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearchClick}
          >
            Zoek
          </Button>
        </ButtonGroup>
        {renderSequences(sequences, nWeeks)}
      </div>
    </div>
  ) : (
    <></>
  );
}

export default App;
