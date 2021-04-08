import * as React from "react";
import { SketchField } from "react-sketch";

export interface HelloWorldProps {
  userName: string;
  lang: string;
}
export const App = (props: HelloWorldProps) => (
  <h1>
    <SketchField tool={"pencil"}/>
    Hi {props.userName} from React! Welcome to {props.lang}!
  </h1>
);
