import React from 'react';
import HomePageFeatures from '../data/features';
import Translate, { translate } from '@docusaurus/Translate';

const FeatureBlock = () => {
  return (
    <div className="hero">
      <div className="container">
        <section className="features section">
          <h2 className="title">
            <Translate>Highlights</Translate>
          </h2>
          <div className="container">
            {HomePageFeatures.map(
              ({ imgUrl, title, description, reverse }, index) => (
                <div key={index} className="row feature">
                  <div className="col col--3">
                    <div className="text--center">
                      {imgUrl && (
                        <img
                          className="featureImage"
                          src={imgUrl}
                          alt={title}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col col--9 featureDesc">
                    <div>
                      <h2>{title}</h2>
                      <div>{description}</div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default FeatureBlock;
