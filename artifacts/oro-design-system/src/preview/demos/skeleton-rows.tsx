import { SkeletonRows } from "../../components/ui/skeleton-rows";
import { Title } from "../foundations";
export default function Demo(){return <><Title eyebrow="Components / Loading" title="Skeleton rows" sub="Original default of four rows, configurable count, aria-busy and Loading label. Motion respects reduced-motion preferences."/><div className="ds-panel"><SkeletonRows/></div><div className="ds-panel"><SkeletonRows rows={2}/></div></>}
