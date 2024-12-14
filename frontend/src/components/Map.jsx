import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import logo from '/assets/flaskify-primary.png';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map = () => {
  // Liliw, Laguna coordinates
  const position = [14.133825233180493, 121.43517206288885];

  const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border-2 border-[#FFD700] relative">
      <MapContainer 
        center={position} 
        zoom={20} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        className="z-[1]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={customIcon}>
          <Popup>
            <div className="text-center">
                <img src={logo} alt="Flaskify Logo" className="w-10 h-10 mx-auto mb-2" />
              <h3 className="font-medium text-[#062a51]">Flaskify</h3>
              <p className="text-sm text-gray-600">083 Rizal Street, Liliw, Laguna</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default Map; 