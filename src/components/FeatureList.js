import React from 'react';
import HomePageFeatures from '../data/features';
import clsx from 'clsx';
import styles from '../pages/styles.module.css';

const FeatureBlock = () => {
    return (
        <div className={clsx('hero', styles.hero)}>
            <div className="container">
                <section className={styles.features}>
                    <div className="container">
                        {
                            HomePageFeatures.map(({imgUrl, title, description, reverse}, index) => (
                                <div key={index} className={clsx('row', styles.feature, reverse ? styles.featureReverse : '')}>
                                    <div className="col col--3">
                                        <div className="text--center">
                                            {imgUrl && <img className={styles.featureImage} src={imgUrl} alt={title} />}
                                        </div>
                                    </div>
                                    <div className={clsx('col col--9', styles.featureDesc)}>
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