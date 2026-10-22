import { Inbox, FileText } from "lucide-react";
import { Empty } from "../../components/ui/empty-state";
import { Title } from "../foundations";
export default function Demo(){return <><Title eyebrow="Components / Empty" title="A clear empty state" sub="Icon, title and optional explanatory content. Loading is a separate state."/><div className="ds-panel"><Empty icon={Inbox} title="Queue is clear">When Sales sends a draft, it lands here.</Empty></div><div className="ds-panel"><Empty icon={FileText} title="No quotations yet"/></div></>}
