const fs = require('fs');
const path = require('path');

// Function to generate file paths for different versions
function getVersionedPaths(basePath) {
  const versions = ['v1.7', 'v1.8', 'v1.9', 'v1.10'];
  const paths = [];
  
  // Only include versions that exist in the directory
  for (const version of versions) {
    const versionedPath = `versioned_docs/version-${version}`;
    if (fs.existsSync(path.join(process.cwd(), versionedPath))) {
      paths.push({
        path: `${versionedPath}/${basePath}`,
        fixes: []
      });
    }
  }
  
  return paths;
}

// Base files to fix
const baseFiles = [
  // AWS Bridgecrew Read Only
  {
    path: 'docs/end-user/components/cloud-services/terraform/aws-bridgecrew-read-only.md',
    fixes: [
      { from: '{org_name}', to: '\\{org_name\\}' }
    ]
  },
  // AWS ECS Container Definition
  {
    path: 'docs/end-user/components/cloud-services/terraform/aws-ecs-container-definition.md',
    fixes: [
      { from: '{namespace}', to: '\\{namespace\\}' }
    ]
  },
  // GCP GKE Ecommerce
  {
    path: 'docs/end-user/components/cloud-services/terraform/gcp-gke-ecommerce.md',
    fixes: [
      { from: 'string', to: '\\{string\\}' },
      { from: 'bool', to: '\\{bool\\}' },
      { from: 'number', to: '\\{number\\}' },
      { from: 'map\(any\)', to: '\\{map(any)\\}' }
    ]
  },
  // GCP Network
  {
    path: 'docs/end-user/components/cloud-services/terraform/gcp-network.md',
    fixes: [
      { from: 'string', to: '\\{string\\}' },
      { from: 'bool', to: '\\{bool\\}' },
      { from: 'number', to: '\\{number\\}' },
      { from: 'list\(map\(string\)\)', to: '\\{list(map(string))\\}' },
      { from: 'map\(list\(object\(\{[^}]*\}\)\)\)', to: '\\{map(list(object(...)))\\}' }
    ]
  },
  // CUE External Packages
  {
    path: 'docs/platform-engineers/cue/external-packages.md',
    fixes: [
      { from: '{endpoint}', to: '\\{endpoint\\}' }
    ]
  },
  // CLI vela_ql
  {
    path: 'docs/cli/vela_ql.md',
    fixes: [
      { from: '{value1}', to: '\\{value1\\}' }
    ]
  },
  // CLI vela
  {
    path: 'docs/cli/vela.md',
    fixes: [
      { from: '{value1}', to: '\\{value1\\}' }
    ]
  }
];

// Generate versioned file paths with the same fixes as their base files
const versionedFiles = [];
baseFiles.forEach(file => {
  const basePath = file.path.replace('docs/', '');
  const versionedPaths = getVersionedPaths(basePath).map(v => ({
    ...v,
    fixes: [...file.fixes] // Copy fixes from base file
  }));
  versionedFiles.push(...versionedPaths);
});

// Combine base and versioned files
const filesToFix = [...baseFiles, ...versionedFiles];

function fixFile(filePath, fixes) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    // Skip logging for versioned files that don't exist
    if (!filePath.includes('version-')) {
      console.log(`File not found: ${filePath}`);
    }
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  const changes = [];

  fixes.forEach(({ from, to }) => {
    if (content.includes(from)) {
      const before = content;
      content = content.replace(new RegExp(escapeRegExp(from), 'g'), to);
      if (before !== content) {
        modified = true;
        changes.push(`Replaced ${from} with ${to}`);
      }
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    changes.forEach(change => console.log(`   ${change}`));
  } else {
    console.log(`ℹ️  No changes needed for: ${filePath}`);
  }
  
  return modified;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Process all files
filesToFix.forEach(({ path: filePath, fixes }) => {
  fixFile(filePath, fixes);
});
