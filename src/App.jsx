import { useState, useEffect } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson';
import './App.css'

function App() {
  const [myUserData, setMyUserData] = useState('');
  const [myCountiesData, setMyCountiesData] = useState();
  const [loadUserData, setLoadUserData] = useState(false)
  const [loadCountiesData, setLoadCountiesData] = useState(false)
  const w = 1000;
  const h = 700;

  useEffect(() => {
    fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json")
      .then(res => res.json())
      .then(d => setMyUserData(d))
      .then(() => setLoadUserData(true));

    fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json")
      .then(res => res.json())
      .then(d => setMyCountiesData(d))
      .then(() => setLoadCountiesData(true));
  }, [0])

  useEffect(() => {
    if (loadUserData && loadCountiesData) {
      const min = d3.min(myUserData, (d) => d.bachelorsOrHigher);
      const max = d3.max(myUserData, (d) => d.bachelorsOrHigher);
      const xAxis = d3.scaleLinear().domain([min, max]).rangeRound([600, 860])

      const colors = d3.scaleThreshold()
        .domain(d3.range(min, max, (max - min) / 9))
        .range(d3.schemeReds[9]);

      const svg = d3.select("#chart")
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("id", "mySvg")

      svg.append("g")
        .attr("id", "legend")
        .selectAll('rect')
        .data(colors.range().map((d) => {
          d = colors.invertExtent(d);

          if (d[0] === null) {
            d[0] = xAxis.domain()[0];
          }
          if (d[1] === null) {
            d[1] = xAxis.domain()[1];
          }

          return d;
        }))
        .enter()
        .append('rect')
        .attr('height', 15)
        .attr('x', (d) => xAxis(d[0]))
        .attr('width', (d) => d[0] && d[1] ? xAxis(d[1]) - xAxis(d[0]) : xAxis(null))
        .attr('fill', (d) => colors(d[0]));

      svg.select('#legend')
        .call(
          d3.axisBottom(xAxis)
            .tickSize(15)
            .tickFormat((xAxis) => Math.round(xAxis) + "%")
            .tickValues(colors.domain())
        )
        .select('.domain')
        .remove();

      const feature = topojson.feature(myCountiesData, myCountiesData.objects.counties);

      // Map
      svg
        .append('g')
        .attr("id", "counties")
        .selectAll("path")
        .data(feature.features)
        .enter()
        .append("path")
        .attr("class", "county")
        .attr("data-fips", (d) => d.id)
        .attr("data-education", (d) => {
          let info = myUserData.filter((data) => data.fips === d.id);
          return info[0].bachelorsOrHigher;
        })
        .attr("d", d3.geoPath())
        .attr("fill", (d) => {
          let result = myUserData.filter((data) => data.fips === d.id);
          if (result[0]) {
            return colors(result[0].bachelorsOrHigher);
          }
          return colors[0];
        })
        .on("mouseover", (e, d) => {
          let info = myUserData.filter((data) => data.fips === d.id);

          d3.select("#tooltip")
            .style("display", "inline")
            .attr("data-education", () => info[0].bachelorsOrHigher)
            .style("left", e.layerX + 15 + "px")
            .style("top", e.layerY - 5 + "px")
            .html(() => {
              return `<div id="info">
                        <div id="area_name">${info[0].area_name}, ${info[0].state} ${info[0].bachelorsOrHigher}%</div>
                      </div>`;
            })
        })
        .on("mouseout", (e, d) => {
          d3.select("#tooltip")
            .style("display", "none")
        })

      svg.append("path")
        .datum(topojson.mesh(myCountiesData, myCountiesData.objects.states, (a, b) => a !== b))
        .attr('id', 'states')
        .attr('d', d3.geoPath())
    }
  }, [loadUserData, loadCountiesData]);

  return loadUserData && loadCountiesData ? (
    <div id="App">
      <h1 id="title">Choropleth Map</h1>
      <h3 id="description">
        Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)
      </h3>
      <div id="chart">
        <div id="tooltip"></div>
      </div>
      <div>
        Created by <a href="https://github.com/DinosMpo/freecodecamp-d3-choropleth-map" target="_blank" rel="noreferrer">DinosMpo</a>
      </div>
    </div>
  )
    :
    (
      <div>Loading....</div>
    )
}

export default App