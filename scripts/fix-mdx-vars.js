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
      { from: '{org_name}', to: '\\{org_name\\}' } // Example: keep as is if this syntax is intended for non-MDX variables
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
      // Clean up doubly-escaped/wrapped backticked simple types
      { from: '\\{\\{`string`\\}\\}', to: '`string`' },
      { from: '\\{\\{`bool`\\}\\}',   to: '`bool`'   },
      { from: '\\{\\{`number`\\}\\}', to: '`number`' },
      // Clean up singly-escaped/wrapped backticked simple types
      { from: '\\{`string`\\}', to: '`string`' },
      { from: '\\{`bool`\\}',   to: '`bool`'   },
      { from: '\\{`number`\\}', to: '`number`' },
      
      // Complex type: object({ state = ..., key_name = ... })
      // Case 1: Inner types are \\{`type`\\}
      { from: 'object({ state = \\{`string`\\}, key_name = \\{`string`\\} })', to: '`object({ state = `string`, key_name = `string` })`' },
      // Case 2: Inner types are `type` (already good)
      { from: 'object({ state = `string`, key_name = `string` })', to: '`object({ state = `string`, key_name = `string` })`' }, // Idempotent
      // Case 3: Inner types are plain string
      { from: 'object({ state = string, key_name = string })', to: '`object({ state = `string`, key_name = `string` })`', useWordBoundaries: false },

      // Complex type: map(any)
      { from: '\\{\\{`map(any)`\\}\\}', to: '`map(any)`' }, // if map(any) was already backticked and wrapped
      { from: '\\{`map(any)`\\}', to: '`map(any)`' },
      { from: 'map(any)', to: '`map(any)`', useWordBoundaries: false },

      // Simple types: ensure they are correctly backticked (use word boundaries for plain types)
      { from: '\\{string\\}', to: '`string`' }, { from: 'string', to: '`string`', useWordBoundaries: true },
      { from: '\\{bool\\}',   to: '`bool`'   }, { from: 'bool',   to: '`bool`',   useWordBoundaries: true },
      { from: '\\{number\\}', to: '`number`' }, { from: 'number', to: '`number`', useWordBoundaries: true },
      { from: '\\{any\\}',    to: '`any`'    }, { from: 'any',    to: '`any`',    useWordBoundaries: true }
    ]
  },
  // GCP Network
  {
    path: 'docs/end-user/components/cloud-services/terraform/gcp-network.md',
    fixes: [
      // Clean up doubly-escaped/wrapped backticked simple types
      { from: '\\{\\{`string`\\}\\}', to: '`string`' },
      { from: '\\{\\{`bool`\\}\\}',   to: '`bool`'   },
      { from: '\\{\\{`number`\\}\\}', to: '`number`' },
      // Clean up singly-escaped/wrapped backticked simple types
      { from: '\\{`string`\\}', to: '`string`' },
      { from: '\\{`bool`\\}',   to: '`bool`'   },
      { from: '\\{`number`\\}', to: '`number`' },

      // Complex type: list(map(string))
      { from: '\\{list(map(``string``))\\}', to: '`list(map(`string`))`' }, // Inner string was ``string``
      { from: '\\{list(map(string))\\}',   to: '`list(map(`string`))`' }, // Inner string was plain
      { from: 'list(map(string))',       to: '`list(map(`string`))`', useWordBoundaries: false },

      // Complex type: map(list(object({ range_name = ..., ip_cidr_range = ... })))
      { from: 'map(list(object({ range_name = \\{`string`\\}, ip_cidr_range = \\{`string`\\} })))', to: '`map(list(object({ range_name = `string`, ip_cidr_range = `string` })))`' },
      { from: 'map(list(object({ range_name = `string`, ip_cidr_range = `string` })))', to: '`map(list(object({ range_name = `string`, ip_cidr_range = `string` })))`' }, // Idempotent
      { from: 'map(list(object({ range_name = string, ip_cidr_range = string })))', to: '`map(list(object({ range_name = `string`, ip_cidr_range = `string` })))`', useWordBoundaries: false },
      
      // Simple types: ensure they are correctly backticked (use word boundaries for plain types)
      { from: '\\{string\\}', to: '`string`' }, { from: 'string', to: '`string`', useWordBoundaries: true },
      { from: '\\{bool\\}',   to: '`bool`'   }, { from: 'bool',   to: '`bool`',   useWordBoundaries: true },
      { from: '\\{number\\}', to: '`number`' }, { from: 'number', to: '`number`', useWordBoundaries: true },
      { from: '\\{any\\}',    to: '`any`'    }, { from: 'any',    to: '`any`',    useWordBoundaries: true }
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
    if (!filePath.includes('version-')) {
      console.log(`File not found: ${filePath}`);
    }
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content; // Keep a copy for final check
  const changes = [];

  fixes.forEach(({ from, to, isRegex, useWordBoundaries }) => {
    let regex;
    // Store 'from' representation for logging. If 'from' is a RegExp, its .source gives the string version.
    const fromForLogging = isRegex ? from.source : from;

    if (isRegex) {
      regex = from;
    } else {
      const pattern = escapeRegExp(from);
      // Use word boundaries if specified and applicable (from is a 'word' character suitable for \b)
      const wordBoundaryPattern = /^\w+$/.test(from) && useWordBoundaries;
      regex = wordBoundaryPattern ? new RegExp(`\\b${pattern}\\b`, 'g') : new RegExp(pattern, 'g');
    }

    // Test before replacing to avoid unnecessary operations and ensure 'from' pattern actually exists.
    if (regex.test(content)) {
      const tempContent = content.replace(regex, to);
      if (content !== tempContent) {
        content = tempContent;
        changes.push(`Replaced ${fromForLogging} with ${to}`);
      }
    }
  });

  if (content !== originalContent) { // Check if any change was made overall
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    changes.forEach(change => console.log(`   ${change}`));
    return true;
  } else {
    console.log(`ℹ️  No changes needed for: ${filePath}`);
    return false;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Process all files
filesToFix.forEach(({ path: filePath, fixes }) => {
  fixFile(filePath, fixes);
});
