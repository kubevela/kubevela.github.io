function appendVersionList() {
  const versions = ['v1.5', 'v1.4', 'v1.3', 'v1.2', 'v1.1', 'v1.0'];
  versions.map((version) => {
    var versionItem = document.createElement('li');
    var link = document.createElement('a');
    link.href = '/docs/' + version;
    link.innerText = version + '(Archived)';
    link.classList = ['dropdown__link'];
    versionItem.appendChild(link);
    const element = document.getElementsByClassName('dropdown__menu').item(0);
    if (element) {
      element.appendChild(versionItem);
    }
  });
}

setTimeout(appendVersionList, 500);
