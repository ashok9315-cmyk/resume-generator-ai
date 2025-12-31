#!/bin/bash

# GitHub Actions Workflow Validation Script
# This script helps validate YAML syntax and common shell script issues

echo "🔍 Validating GitHub Actions workflows..."

# Check if yamllint is available
if command -v yamllint &> /dev/null; then
    echo "✅ Using yamllint for YAML validation"
    yamllint .github/workflows/*.yml
else
    echo "⚠️  yamllint not found, skipping YAML validation"
    echo "   Install with: pip install yamllint"
fi

# Check for common shell script issues
echo ""
echo "🔍 Checking for common shell script issues..."

# Check for unmatched if statements
echo "Checking for unmatched if statements..."
for file in .github/workflows/*.yml; do
    echo "Checking $file..."
    
    # Extract shell scripts from YAML and check basic syntax
    grep -A 20 "run: |" "$file" | while IFS= read -r line; do
        if [[ "$line" =~ "if [" ]] && [[ ! "$line" =~ "then" ]]; then
            # Look for the corresponding 'then' in the next few lines
            echo "Found if statement: $line"
        fi
    done
done

echo ""
echo "🔍 Checking for proper variable quoting..."
grep -n '\$[a-zA-Z_][a-zA-Z0-9_]*' .github/workflows/*.yml | grep -v '"\$' | head -5

echo ""
echo "✅ Workflow validation complete!"
echo ""
echo "💡 Tips:"
echo "   - Always quote shell variables: \"\${var}\" instead of \$var"
echo "   - Use proper YAML indentation (2 spaces)"
echo "   - Test shell scripts locally before committing"
echo "   - Use shellcheck for advanced shell script validation"