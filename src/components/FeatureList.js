import React from 'react';
import HomePageFeatures from '../data/features';

const FeatureBlock = () => {
    return (
        <div className="hero">
            <div className="container">
                <section className="features">
                    <div className="container">
                        {
                            HomePageFeatures.map(({imgUrl, title, description, reverse}, index) => (
                                <div key={index} className="row feature">
                                    <div className="col col--3">
                                        <div className="text--center">
                                            {imgUrl && <img className="featureImage" src={imgUrl} alt={title} />}
                                        </div>
                                    </div>
                                    <div className="col col--9 featureDesc">
                                        <div>
                                            <h2>{title}</h2>
                                            <div>{description}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </section>
            </div>
        </div>
    )
}

export default FeatureBlock