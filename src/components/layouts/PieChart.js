import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const PieChart = () => {
  const svgRef = useRef();
  const dataUrl = "https://raw.githubusercontent.com/nguyenlamvu88/dsci_554_arms_sales_project/main/data/processed/processed_regional_transfers.csv";
  const [selectedYear, setSelectedYear] = useState(2023); // Default year
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  const [legendData, setLegendData] = useState([]);
  const [totalArmsTrade, setTotalArmsTrade] = useState(0);

  useEffect(() => {
    const width = 500; // Adjust as needed
    const height = 600; // Match the container's height
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .attr('fill', '#0db4de')
      .text(`Arms Imports by Region (${selectedYear})`);

    d3.csv(dataUrl).then(data => {
      data.forEach(d => {
        for (let year = 1950; year <= 2023; year++) {
          d[year] = +d[year] / 1000 || 0;
        }
      });

      const filteredData = data.filter(d => 
        d['Imports by Regions'] !== 'World total' && d['Imports by Regions'] !== 'International organizations'
      );

      const regionArmsData = Array.from(
        d3.group(filteredData, d => d['Imports by Regions']),
        ([region, values]) => ({
          region,
          armsTrade: values[0][selectedYear] || 0
        })
      );

      const totalArmsTrade = d3.sum(regionArmsData, d => d.armsTrade);
      setTotalArmsTrade(totalArmsTrade);

      if (totalArmsTrade === 0) {
        svg.append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .text('No data available for this year');
        return;
      }

      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
      const legendInfo = regionArmsData.map(d => ({
        region: d.region,
        color: colorScale(d.region),
        percentage: ((d.armsTrade / totalArmsTrade) * 100).toFixed(2),
        armsTrade: d.armsTrade
      }));
      setLegendData(legendInfo);

      const pie = d3.pie().value(d => d.armsTrade);
      const arc = d3.arc().outerRadius(radius - 10).innerRadius(0);
      const arcHover = d3.arc().outerRadius(radius).innerRadius(0);

      svg.append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`)
        .selectAll('path')
        .data(pie(regionArmsData))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.region))
        .attr('stroke', 'white')
        .attr('opacity', 0.85)
        .on('mouseenter', (event, d) => {
          const regionPercentage = ((d.data.armsTrade / totalArmsTrade) * 100).toFixed(2);
          setTooltip({
            visible: true,
            x: event.pageX,
            y: event.pageY,
            content: `${d.data.region}\nArms Imports: ${d.data.armsTrade.toLocaleString()} billion USD (${regionPercentage}%)`,
          });

          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('d', arcHover)
            .attr('opacity', 1);
        })
        .on('mousemove', (event) => {
          setTooltip(prev => ({
            ...prev,
            x: event.pageX + 10,
            y: event.pageY + 10,
          }));
        })
        .on('mouseleave', (event) => {
          setTooltip({ visible: false, x: 0, y: 0, content: '' });

          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('d', arc)
            .attr('opacity', 0.85);
        });

      svg.append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`)
        .selectAll('text')
        .data(pie(regionArmsData))
        .enter()
        .append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .text(d => `${((d.data.armsTrade / totalArmsTrade) * 100).toFixed(1)}%`);
    }).catch(error => {
      console.error("Error loading data:", error);
    });
  }, [dataUrl, selectedYear]);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: '500px' }}>
      <svg ref={svgRef}></svg>

      <div style={{ marginLeft: '40px', marginTop: '-110px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '5px', fontSize: '14px', color: '#333', width: '250px' }}>

        <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
          Total Arms Trade: {totalArmsTrade ? totalArmsTrade.toLocaleString() : '0'} billion USD
        </p>
        {legendData.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '14px' }}>
            <div
              style={{
                width: '20px',
                height: '15px',
                backgroundColor: entry.color,
                marginRight: '10px',
              }}
            ></div>
            <div>
              <span>{entry.region}</span><br />
              <span style={{ fontSize: '14px' }}>{entry.percentage}% ({entry.armsTrade ? entry.armsTrade.toLocaleString() : '0'}B USD)</span>
            </div>
          </div>
        ))}

        {/* Year Slider */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <label style={{ color: '#0db4de', fontWeight: 'bold', marginBottom: '10px' }}>Select Year: {selectedYear}</label>
          <input
            type="range"
            min="1950"
            max="2023"
            value={selectedYear}
            onChange={(e) => setSelectedYear(+e.target.value)}
            style={{
              width: '100%',
              marginTop: '10px',
              appearance: 'none',
              backgroundColor: '#e74c3c',
              height: '8px',
              borderRadius: '5px',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            top: tooltip.y + 10,
            left: tooltip.x + 10,
            whiteSpace: 'pre-line',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '5px',
            borderRadius: '5px',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
            fontSize: '12px',
            color: '#333',
            pointerEvents: 'none',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default PieChart;
