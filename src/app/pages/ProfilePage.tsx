import { User, Download, BookOpen, Activity, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { useAuth } from "../providers/AuthProvider";

export function ProfilePage() {
  const { user } = useAuth();
  const userName = user?.name || "Student";
  const userEmail = user?.email || "No email linked";

  const stats = [
    { icon: Download, label: "Downloads", value: "23", color: "text-blue-600" },
    { icon: BookOpen, label: "Books Read", value: "12", color: "text-green-600" },
    { icon: Activity, label: "Active Days", value: "45", color: "text-purple-600" },
  ];

  const recentActivity = [
    { title: "Web Development with React", action: "Downloaded", time: "2 hours ago" },
    { title: "Machine Learning Fundamentals", action: "Viewed", time: "5 hours ago" },
    { title: "Data Structures and Algorithms", action: "Downloaded", time: "1 day ago" },
    { title: "Cybersecurity Essentials", action: "Bookmarked", time: "2 days ago" },
  ];

  const testingPhases = [
    { version: "0.1-0.2", phase: "Unit Testing", status: "completed", progress: 100 },
    { version: "0.3-0.5", phase: "Integration Testing", status: "completed", progress: 100 },
    { version: "0.8-0.9", phase: "System Testing", status: "current", progress: 85 },
    { version: "0.9-1.0", phase: "Acceptance Testing", status: "upcoming", progress: 0 },
    { version: "1.1+", phase: "Regression Testing", status: "upcoming", progress: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        <p className="text-gray-600 mt-1">Your library activity and system information</p>
      </div>

      {/* User Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-full">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{userName}</h3>
              <p className="text-gray-600">{userEmail}</p>
              <Badge variant="secondary" className="mt-2">Active User</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-10 h-10 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions with the library</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Version */}
        <Card>
          <CardHeader>
            <CardTitle>System Version Info</CardTitle>
            <CardDescription>Current version: v0.9 - System Testing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testingPhases.map((phase, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {phase.status === "completed" && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {phase.status === "current" && (
                        <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                      )}
                      {phase.status === "upcoming" && (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span className="font-medium text-sm">{phase.phase}</span>
                    </div>
                    <Badge
                      variant={
                        phase.status === "completed"
                          ? "default"
                          : phase.status === "current"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {phase.version}
                    </Badge>
                  </div>
                  <Progress value={phase.progress} className="h-2" />
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 font-medium mb-1">
                Current Phase: System Testing
              </p>
              <p className="text-xs text-blue-700">
                Testing the entire system as one complete product. Final bug fixes before v1.0 release.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
