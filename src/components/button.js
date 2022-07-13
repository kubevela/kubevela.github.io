import React from 'react';
import Link from '@docusaurus/Link';

const Button = ({ children, href }) => {
    return (
        <div className="col col--2 margin--sm">
            <Link
                className="button button--outline button--primary button--lg"
                to={href}>
                {children}
            </Link>
        </div>
    );
};

export default Button;
