import clsx from "clsx";
import styles from "../pages/styles.module.css";
import React from 'react';
import Translate, { translate } from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';

const WhatIs = () => (
    <div className={clsx('hero', styles.hero)}>
        <div className="container">
            <div className="row">
                <div className="col col--6">
                    <h1><Translate>What is KubeVela?</Translate></h1>
                    <p className="hero__subtitle">
                        <small>
                            <Translate>
                                KubeVela is a modern software delivery platform that makes deploying and operating applications across today's hybrid, multi-cloud environments
                            </Translate><i><Translate> easier, faster and more reliable.</Translate></i>
                            <br />
                            <br />
                            <Translate>
                                KubeVela is infrastructure agnostic, programmable, yet most importantly,
                            </Translate><i><b> <Translate>application-centric.</Translate></b></i>
                            <Translate> It allows you to build powerful software, and deliver them anywhere!</Translate>
                        </small>
                    </p>
                </div>
                <div className="col">
                    <img
                        className="image"
                        src={useBaseUrl("img/what-is-kubevela.png")}
                        align="right"
                        alt="what is kubevela"
                    />
                </div>
            </div>
        </div>
    </div >
);

export default WhatIs