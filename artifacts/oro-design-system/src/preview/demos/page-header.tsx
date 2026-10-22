import { PageHeader } from "../../components/ui/page-header";
import { Button } from "../../components/ui/button";
import { Title } from "../foundations";
export default function Demo(){return <><Title eyebrow="Components / Header" title="Page header" sub="Eyebrow, title, optional supporting copy and optional actions, with the original flex wrapping."/><div className="ds-panel"><PageHeader eyebrow="Staff schedule" title="Who is free, day by day" sub="Leave, Orbyte jobs and ORO bookings." actions={<Button>Next week</Button>}/></div><div className="ds-panel"><PageHeader eyebrow="Activity log" title="What happened, and who did it"/></div></>}
