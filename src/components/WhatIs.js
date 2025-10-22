import React from 'react';
import Translate, { translate } from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Mermaid from '@theme/Mermaid';

const WhatIs = () => (
    <div className="hero">
        <div className="container">
            <div className="row">
                <div className="col col--5">
                    <h1><Translate>What is KubeVela?</Translate></h1>
                    <p><Translate>KubeVela is a modern application platform that transforms how you deploy and operate applications across hybrid and multi-cloud environments. Built for speed, reliability, and simplicity.</Translate></p>
                    <p><Translate>Infrastructure agnostic and fully programmable, KubeVela puts applications first. Focus on building powerful software while KubeVela handles the complexity of delivering it anywhere.</Translate></p>
                    <p><Translate>Build comprehensive interfaces to your underlying platform and expose them to users in a controlled and easy-to-use manner. Build governance and best practices directly into your components, creating golden paths that scale across your entire organization.</Translate></p>
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