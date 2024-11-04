import { Map, Marker, ZoomControl } from "pigeon-maps"
import { useState } from "react"

export default function FMap() {
    const [position, setPosition] = useState([50.879, 4.6997])

  return (
    <Map height={300} defaultCenter={[50.879, 4.6997]} defaultZoom={11} onClick={(e) => setPosition(e.latLng)}>
        <ZoomControl />
        <Marker width={50} anchor={position} />
    </Map>
  )
}