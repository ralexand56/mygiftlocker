Pod::Spec.new do |s|
  s.name           = 'MGLHinge'
  s.version        = '1.0.0'
  s.summary        = 'Hinge angle and status on foldable iPhones'
  s.description    = 'Reports UIHingeInteraction updates (iOS 27.1+) to JavaScript.'
  s.license        = 'UNLICENSED'
  s.author         = 'My Gift Lockers'
  s.homepage       = 'https://www.mygiftlockers.com'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES', 'SWIFT_COMPILATION_MODE' => 'wholemodule' }
end
