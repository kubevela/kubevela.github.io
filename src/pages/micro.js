import React from 'react';
import Layout from '@theme/Layout';
import Translate from '@docusaurus/Translate';

export default function Home() {
  return (
    <Layout
      title={'Microservice Ecosystem Landscape'}
      description={'Microservice Ecosystem Landscape'}
    >
      <div className="msemap-container">
        <h3
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            textAlign: 'center',
            margin: '32px 0',
          }}
        >
          <Translate>Microservice Ecosystem Landscape</Translate>
        </h3>
        <div id="mse-arc-container"></div>
      </div>
    </Layout>
  );
}
