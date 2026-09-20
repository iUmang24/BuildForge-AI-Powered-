import { PublicNavbar } from "@/components/public-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Clock, LifeBuoy } from "lucide-react";
import Link from "next/link";
import {
  ClipboardCheck,
  Users,
  Award,
  Rocket,
  CheckCircle,
  Code,
  MessageSquare,
  TrendingUp,
  Star,
} from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Apply",
    description: "Submit your application with your skills and interests. Get matched to the right internship track.",
  },
  {
    icon: Users,
    title: "Unlock Weeks",
    description: "After Week 1 review, unlock rest of the weeks with minimal payment.",
  },
  {
    icon: Code,
    title: "Complete Weekly Tasks",
    description: "Work on real-world projects with clear requirements, resources, and rubrics to guide you.",
  },

  {
    icon: Award,
    title: "Earn Your Certificate",
    description: "Complete all tasks and reviews to receive a verified certificate.",
  },
];

const features = [
  {
    icon: Rocket,
    title: "Project-Based Learning",
    description: "Build real applications that you can add to your portfolio. No theoretical fluff.",
  },
  {
    icon: MessageSquare,
    title: "Structured Feedback",
    description: "Get detailed feedback from admin. Improve with every task.",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description: "Visual dashboard showing your journey from week 1 to completion with clear milestones.",
  },
  {
    icon: CheckCircle,
    title: "Self-Paced Learning",
    description: "Work at your own pace within weekly deadlines. No live sessions required.",
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Frontend Developer at TechCorp",
    content:
      "InternTrack helped me build real projects that impressed my interviewers. The peer review system taught me how to give and receive constructive feedback.",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "Junior Developer at StartupXYZ",
    content:
      "As someone without connections in tech, this platform gave me the practical experience I needed. My certificate helped me land my first job.",
    rating: 5,
  },
  {
    name: "Aisha Patel",
    role: "CS Student at State University",
    content:
      "The structured tasks and clear rubrics made learning so much easier. I finally understood what professional code looks like.",
    rating: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto text-center">

          <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            Project-Based Virtual Internship Program
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Work on Real Projects
            <br />
            <span className="text-primary">
              Earn Certification Based on Skills
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            BuildForge is an 8-week structured internship where participants gain hands-on experience by completing real-world development projects. Each week includes practical tasks that are reviewed and evaluated to measure your progress. Your certificate is awarded based on your performance and project quality — not attendance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" asChild className="text-base px-8">
              <Link href="/apply">Begin Week 1 (Free)</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 bg-transparent">
              <Link href="/login">Login</Link>
            </Button>
          </div>

          <div className="max-w-3xl mx-auto text-sm text-muted-foreground border-t pt-6">
            ✔ 8 Structured Weeks &nbsp; • &nbsp;
            ✔ Weekly Project Tasks &nbsp; • &nbsp;
            ✔ Performance-Based Evaluation &nbsp; • &nbsp;
            ✔ Verified Certificate
          </div>

        </div>
      </section>

      <section id="features" className="py-20 px-4 bg-secondary">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for Aspiring Developers
          </h2>
          <p className="text-muted-foreground">
            Ideal for college students, fresh graduates, and professionals looking to strengthen their development portfolio.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Real Projects, Real Experience</h3>
              <p className="text-sm text-muted-foreground">
                Develop deployable applications that demonstrate practical coding ability.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Performance-Driven Certification</h3>
              <p className="text-sm text-muted-foreground">
                Earn recognition based on your project work and evaluation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Structured & Accessible</h3>
              <p className="text-sm text-muted-foreground">
                Affordable, guided learning focused on building real-world skills.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Who This Program Is Designed For
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-primary mb-4">
                ✅ Great Fit If You:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Want to learn development by building real projects</li>
                <li>• Want strong portfolio projects for your resume</li>
                <li>• Are preparing for internships, placements, or tech careers</li>
                <li>• Prefer structured guidance instead of random tutorials</li>
                <li>• Want practical experience that recruiters value</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-destructive mb-4">
                ❌ Not Ideal If You:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Only want a certificate without effort</li>
                <li>• Are not interested in hands-on project work</li>
                <li>• Prefer watching lectures instead of building</li>
                <li>• Expect daily live classes instead of a project-based format</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ================= CHOOSE YOUR PATH ================= */}
      <section id="route" className="py-20 px-4 bg-secondary">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Choose Your Path
          </h2>
          <p className="text-muted-foreground">
            Complete structured training or submit your own project for evaluation.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">

          {/* Training */}
          <Card className="bg-card border-border">
            <CardContent className="p-8 space-y-4">
              <h3 className="text-xl font-semibold text-primary">
                8-Week Guided Training
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>✔ Apply & Access Week 1 (Free)</li>
                <li>✔ Unlock Full 8 Weeks</li>
                <li>✔ Complete Weekly Real-World Tasks</li>
                <li>✔ Get Evaluated by Our Team</li>
                <li>✔ Receive Performance-Based Internship Certificate</li>
              </ul>
              {/* PRICE */}
              <div className="pt-2 border-t space-y-1">
                <p className="text-sm text-muted-foreground">
                  Training Program: <span className="font-semibold text-foreground">₹1000</span>
                </p>

                <p className="text-sm text-muted-foreground">
                  Certificate (after completion):{" "}
                  <span className="font-semibold text-foreground">₹500</span>
                </p>

                <p className="text-xs text-muted-foreground">
                  Certificate is issued only after successful completion of all tasks.
                </p>
              </div>
              <Button asChild>
                <Link href="/apply">Start Training</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Direct Evaluation */}
          <Card className="bg-card border-border">
            <CardContent className="p-8 space-y-4">
              <h3 className="text-xl font-semibold text-primary">
                Project Evaluation Route
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>✔ Build Your Own Project</li>
                <li>✔ Submit GitHub & Live URLs</li>
                <li>✔ Admin Code Review</li>
                <li>✔ Get Approval</li>
                <li>✔ Download Internship Certificate</li>
              </ul>
              {/* PRICE */}
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Evaluation + Certificate: <span className="font-semibold text-foreground">₹2000</span>
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/apply">Submit Project</Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* How it Works training */}
      <section id="how-it-works" className="py-20 px-4 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">How Internship Training Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our structured approach ensures you learn practical skills while building real projects.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={step.title} className="bg-secondary border-border relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-muted/30">{index + 1}</div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================= EVALUATION PROCESS ================= */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How Project Evaluation Works
          </h2>
          <p className="text-muted-foreground">
            We review your project for structure, implementation, and deployment quality.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">

          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-2">1. Repository Review</h4>
              <p className="text-sm text-muted-foreground">
                We verify GitHub commits, project structure, and coding standards.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-2">2. Feature Implementation</h4>
              <p className="text-sm text-muted-foreground">
                Business logic, validations, authentication, APIs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-2">3. Deployment</h4>
              <p className="text-sm text-muted-foreground">
                Working live frontend & backend required for approval.
              </p>
            </CardContent>
          </Card>

        </div>
      </section>



      {/* ================= SAMPLE CERTIFICATES ================= */}
      <section id="certificate" className="py-20 px-4 bg-card">
        <div className="max-w-7xl mx-auto text-center">

          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Sample Certificates
          </h2>

          <p className="text-muted-foreground mb-12">
            BuildForge offers two certification paths depending on how you complete the program.
          </p>

          <div className="grid md:grid-cols-2 gap-10">

            {/* TRAINING CERTIFICATE */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-primary">
                Internship Training Certificate
              </h3>

              <div className="border rounded-xl p-4 bg-secondary shadow-xl mb-4 overflow-hidden">
                <img
                  src="/certificate.png"
                  alt="Training Certificate"
                  className="rounded-lg shadow-lg w-full transition-all duration-300 hover:scale-110 hover:shadow-2xl"
                />
              </div>

              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✔ Issued after completing the full 8-week internship</li>
                <li>✔ Includes internship duration</li>
                <li>✔ Technology domain mentioned</li>
                <li>✔ Performance evaluation included</li>
              </ul>
            </div>

            {/* PROJECT EVALUATION CERTIFICATE */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-primary">
                Project Evaluation Internship Certificate
              </h3>

              <div className="border rounded-xl p-4 bg-secondary shadow-xl mb-4 overflow-hidden">
                <img
                  src="/direct_certificate.png"
                  alt="Evaluation Certificate"
                  className="rounded-lg shadow-lg w-full transition-all duration-300 hover:scale-110 hover:shadow-2xl"
                />
              </div>

              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✔ For developers or student who already built a project</li>
                <li>✔ Project submitted for expert evaluation</li>
                <li>✔ Code quality and deployment verified</li>
                <li>✔ Verified internship certificate issued</li>
              </ul>
            </div>

          </div>

          <p className="text-xs text-muted-foreground mt-10">
            * Certificates include a unique verification ID and QR code for authenticity.
          </p>

        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      {/* <section className="py-20 px-4 bg-secondary">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            What Our Students Say
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map((_,i)=>(
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_,idx)=>(
                    <Star key={idx} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  “BuildForge helped me gain real-world experience and strengthen my portfolio.”
                </p>
                <div className="font-semibold">Student {i+1}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section> */}

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Why BuildForge?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to gain real-world experience and stand out to employers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Ready to Start Your Journey?
        </h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/apply">Start Free Week 1 Now</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Already Applied? Login</Link>
          </Button>
        </div>
      </section>





      {/* Testimonials */}
      {/* <section id="testimonials" className="py-20 px-4 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">What Our Students Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from students who completed our internship programs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="bg-secondary border-border">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4">{'"'}{testimonial.content}{'"'}</p>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

       */}

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground">
                Is Week 1 really free?
              </h4>
              <p>Yes. You can explore the structure before unlocking the full program.</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground">
                Is this certificate government approved?
              </h4>
              <p>No, It is a performance-based internship certificate issued by BuildForge.</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground">
                Do I need live sessions?
              </h4>
              <p>No. The internship is fully self-paced.</p>
            </div>



            <div>
              <h4 className="font-semibold text-foreground">
                Will this help in placements?
              </h4>
              <p>Yes. You will have deployable projects to demonstrate during interviews.</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground">
                Is this AI-generated project allowed?
              </h4>
              <p>No. Projects must be built and understood by you. Evaluation checks authenticity.</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground">
                Do I get invoice for payment?
              </h4>
              <p>Yes. Invoice is generated after successful payment.</p>
            </div>
          </div>
        </div>
      </section >

      {/* ================= CONTACT ================= */}
      <section id="contact" className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Contact Us
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions about the internship program, certificate evaluation, or payments?
              Our team is here to help you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {/* Email */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">

                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>

                <h3 className="font-semibold text-lg">
                  Email Support
                </h3>

                <p className="text-sm text-muted-foreground">
                  For general inquiries and program related questions.
                </p>

                <a
                  href="mailto:admin@buildforge.net.in"
                  className="text-primary font-medium"
                >
                  admin@buildforge.net.in
                </a>

              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">

                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>

                <h3 className="font-semibold text-lg">
                  Response Time
                </h3>

                <p className="text-sm text-muted-foreground">
                  We usually respond to all inquiries within
                  <span className="font-medium"> 24 hours</span> on working days.
                </p>

              </CardContent>
            </Card>

            {/* Program Support */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">

                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                  <LifeBuoy className="w-6 h-6 text-primary" />
                </div>

                <h3 className="font-semibold text-lg">
                  Program Support
                </h3>

                <p className="text-sm text-muted-foreground">
                  Questions about applications, evaluation,
                  payments, or internship certificates are
                  handled by our admin team.
                </p>

              </CardContent>
            </Card>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* LEFT */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">BF</span>
            </div>
            <span className="text-sm text-muted-foreground">
              © 2026 BuildForge. All rights reserved.
            </span>
          </div>

          {/* CENTER */}
          <div className="text-sm text-muted-foreground">
            Powered by{" "}
            <Link
              href="https://shriva.co.in"
              target="_blank"
              className="text-primary font-semibold hover:underline"
            >
              Shriva Technologies Private Limited
            </Link>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-and-condition" className="hover:text-foreground transition-colors">
              Terms & Condition
            </Link>
          </div>

        </div>
      </footer>
    </div >
  );
}
