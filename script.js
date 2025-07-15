// 🌍 Initialisation de la carte
var map = L.map('map').setView([0, 20], 3.5);

// 🗺️ Fond de carte OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let dataGeoJSON;
let geojsonLayer;

// 🎨 Couleur selon nombre de coups d'État
function getColor(d) {
  return d >= 12 ? '#800026' :
         d >= 7  ? '#BD0026' :
         d >= 3  ? '#FD8D3C' :
                   '#FFEDA0';
}

// 🎨 Style des polygones
function style(feature) {
  const n = feature.properties.total;
  return {
    fillColor: getColor(n),
    weight: 1,
    opacity: 1,
    color: 'white',
    fillOpacity: 0.7
  };
}

// 🧠 Affichage des données GeoJSON avec filtres
function afficherGeoJSON(regionFiltre, paysFiltre) {
  if (geojsonLayer) map.removeLayer(geojsonLayer);

  geojsonLayer = L.geoJSON(dataGeoJSON, {
    style: style,
    filter: function (feature) {
      const props = feature.properties;
      if (!props) return false;

      const region = (props.region || '').toLowerCase();
      const nom = (props.ADM0_NAME || '').toLowerCase();
      const regionOk = (regionFiltre === 'all' || region === regionFiltre);
      const paysOk = (paysFiltre === '' || nom.includes(paysFiltre));
      return regionOk && paysOk;
    },
    onEachFeature: function (feature, layer) {
      const { ADM0_NAME, region, total, reussi } = feature.properties;
      layer.bindPopup(`
        <b>${ADM0_NAME}</b><br>
        Région : ${region}<br>
        Coups d’État totaux : ${total}<br>
        Réussis : ${reussi}
      `);
      if (paysFiltre && feature.properties.ADM0_NAME.toLowerCase() === paysFiltre) {
        map.fitBounds(layer.getBounds());
      }
    }
  }).addTo(map);
}

// 🎯 Événements filtre région
document.getElementById('regionSelect').addEventListener('change', function () {
  const region = this.value;
  const pays = document.getElementById('countryInput').value.toLowerCase();
  afficherGeoJSON(region, pays);
});

// 🎯 Événements recherche pays
document.getElementById('countryInput').addEventListener('input', function () {
  const pays = this.value.toLowerCase();
  const region = document.getElementById('regionSelect').value;
  afficherGeoJSON(region, pays);
});

// 📊 Graphique en camembert par région
function genererGraphiqueParRegion(dataGeoJSON) {
  const regions = {};
  dataGeoJSON.features.forEach(f => {
    const r = f.properties.region;
    const total = f.properties.total || 0;
    if (r) {
      regions[r] = (regions[r] || 0) + total;
    }
  });

  const labels = Object.keys(regions);
  const values = Object.values(regions);
  const couleurs = ['#800026', '#BD0026', '#FD8D3C', '#FEB24C', '#FED976', '#FFEDA0'];

  const ctx = document.getElementById('chartRegion').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Coups d’État par région',
        data: values,
        backgroundColor: couleurs.slice(0, labels.length)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Répartition des coups d’État par région'
        },
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 10
          }
        }
      }
    }
  });
}

// 📦 Chargement GeoJSON
fetch('data/putch.geojson')
  .then(res => res.json())
  .then(data => {
    dataGeoJSON = data;
    afficherGeoJSON('all', '');
    genererGraphiqueParRegion(dataGeoJSON);
  })
  .catch(err => console.error("Erreur chargement GeoJSON :", err));
