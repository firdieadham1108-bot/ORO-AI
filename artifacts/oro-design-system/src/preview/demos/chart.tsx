import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import * as C from "../../components/ui/chart";
import { Title } from "../foundations";
const config={example:{label:"Illustrative values",color:"var(--color-chart-2)"}};
const values=[{label:"A",example:2},{label:"B",example:4},{label:"C",example:3}];
export default function Demo(){return <><Title eyebrow="Data display / Chart" title="Chart container" sub="A behavior-preserving port of the source Recharts wrapper—not a new analytics screen. These arbitrary values demonstrate tooltip, legend and token styling only."/><div className="ds-panel"><C.ChartContainer config={config} className="h-64 w-full"><BarChart data={values}><CartesianGrid vertical={false}/><XAxis dataKey="label"/><C.ChartTooltip content={<C.ChartTooltipContent/>}/><C.ChartLegend content={<C.ChartLegendContent/>}/><Bar dataKey="example" fill="var(--color-example)" radius={4}/></BarChart></C.ChartContainer></div></>}
